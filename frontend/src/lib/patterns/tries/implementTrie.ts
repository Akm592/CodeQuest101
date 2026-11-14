// Implement Trie (Prefix Tree) (NeetCode 150 · Tries).

import py from "../../guides/python/neetcode/implement_trie.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Trie, child, newTrie, rootLabel, trieLayout } from "./trie";

/** Calls like "insert apple", "search app", "startsWith ap". */
type Input = { calls: string[] };

function run({ calls }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = newTrie();
  const out: boolean[] = [];
  let ops = 0;
  let k = -1;
  let word = "";
  let at = -1; // index into word
  let path = new Set<string>();
  let cur: string | null = null;
  let made = new Set<string>();
  let fail: string | null = null;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes = trieLayout(root, {
      tone: (t) => (t.id === fail ? "swap" : t.id === cur ? "current" : made.has(t.id) ? "found" : path.has(t.id) ? "pointer" : undefined),
      edgeTone: (t) => (path.has(t.id) && t.id !== root.id ? (made.has(t.id) ? "found" : "pointer") : undefined),
    });
    steps.push({
      stage,
      explanation,
      rows: [
        row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))),
        ...(k >= 0 && k < calls.length ? [row(`letters of “${word}”`, [...word], Object.fromEntries([...word].map((_, i) => [i, i < at ? "pointer" : i === at ? "current" : undefined])))] : []),
      ],
      tree: { title: "the trie (double ring = a word ends here)", nodes, labels: rootLabel(nodes) },
      vars: [{ name: "results (search / startsWith)", value: out.length ? show(out.map(String)) : "–", tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "A trie starts as a single empty root. Each node has up to 26 children, one per next letter, and a flag saying whether a word ends there. Words that share a prefix share the path for it.");
  calls.forEach((call, j) => {
    k = j;
    const [op, w] = call.split(" ");
    word = w;
    path = new Set([root.id]);
    made = new Set();
    fail = null;
    let t: Trie = root;
    for (at = 0; at < w.length; at++) {
      const ch = w[at];
      ops++;
      if (op === "insert") {
        const [c, created] = child(t, ch);
        t = c;
        path.add(t.id);
        if (created) made.add(t.id);
        cur = t.id;
        snap(
          created ? "add" : "walk",
          created
            ? `insert “${w}”: no child “${ch}” yet, so create one. The path now spells “${w.slice(0, at + 1)}”.`
            : `insert “${w}”: a child “${ch}” already exists (another word shares the prefix “${w.slice(0, at + 1)}”), so just follow it.`,
        );
      } else {
        const c = t.kids.get(ch);
        if (!c) {
          fail = t.id;
          cur = null;
          out.push(false);
          snap("answer", `${op} “${w}”: ${at ? `after “${w.slice(0, at)}” there's` : "the root has"} no child “${ch}”, so no word ${op === "search" ? "is" : "starts with"} “${w}”. Return false.`);
          return;
        }
        t = c;
        path.add(t.id);
        cur = t.id;
        snap("walk", `${op} “${w}”: follow the child “${ch}”. The path spells “${w.slice(0, at + 1)}”.`);
      }
    }
    if (op === "insert") {
      t.end = true;
      ops++;
      snap("mark", `insert “${w}”: at the last letter, mark the node as the end of a word (the double ring).${made.size === 0 ? ` No new nodes were needed: “${w}” was already a prefix of another word.` : ""}`);
    } else if (op === "search") {
      out.push(t.end);
      snap("answer", t.end ? `search “${w}”: every letter was found and the last node is marked as a word end. Return true.` : `search “${w}”: every letter was found, but the last node has no word-end mark: “${w}” is only a prefix of a longer word. Return false.`);
    } else {
      out.push(true);
      snap("answer", `startsWith “${w}”: every letter was found. Some word starts with it, so return true. A prefix doesn't need the word-end mark.`);
    }
  });
  k = calls.length;
  path = new Set();
  cur = null;
  made = new Set();
  fail = null;
  at = -1;
  snap("done", `All calls done. The results are ${show(out.map(String))}.`, { done: true, answer: show(out.map(String)) });
  return steps;
}

function slow({ calls }: Input) {
  // Keep a plain list of words; every query compares against all of them.
  const words: string[] = [];
  const out: boolean[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, w] = call.split(" ");
    ops++;
    if (op === "insert") {
      words.push(w);
      continue;
    }
    let hit = false;
    for (const x of words) {
      ops++;
      const n = op === "search" ? Math.max(x.length, w.length) : w.length;
      let i = 0;
      while (i < n && x[i] === w[i]) {
        i++;
        ops++;
      }
      if (i === n) {
        hit = true;
        break;
      }
    }
    out.push(hit);
  }
  return { answer: show(out.map(String)), ops };
}

export const implementTrie: PatternProblem<Input> = {
  id: "implement-trie",
  title: "Implement Trie (Prefix Tree)",
  difficulty: "Medium",
  blind75: true,
  slug: "implement-trie-prefix-tree",
  video: "oobqoCJlHA0",
  statement: "Build a trie with insert(word), search(word) (is this exact word stored?) and startsWith(prefix) (does any stored word start with it?).",
  examples: [
    { label: "LeetCode's example", input: { calls: ["insert apple", "search apple", "search app", "startsWith app", "insert app", "search app"] } },
    { label: "car, cat, cart", input: { calls: ["insert car", "insert cat", "insert cart", "search ca", "startsWith ca", "search cart", "search care", "startsWith do"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const w = () => Array.from({ length: g.int(1, 4) }, () => g.pick([..."abc"])).join("");
    const words: string[] = [];
    const calls = Array.from({ length: g.int(5, 9) }, (_, i) => {
      if (i < 2 || g.r() < 0.4) {
        const x = w();
        words.push(x);
        return `insert ${x}`;
      }
      const q = g.r() < 0.5 ? g.pick(words).slice(0, g.int(1, 4)) : w();
      return `${g.r() < 0.5 ? "search" : "startsWith"} ${q}`;
    });
    return { calls };
  },
  big: {
    label: "150 words, then 150 searches",
    input: () => {
      const g = rngFor(99);
      const w = () => Array.from({ length: g.int(5, 7) }, () => g.pick([..."abc"])).join("");
      return { calls: [...Array.from({ length: 150 }, () => `insert ${w()}`), ...Array.from({ length: 150 }, () => `search ${w()}`)] };
    },
  },
  describe: ({ calls }) => calls.join(", "),
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Keep the words in a plain list: every search or startsWith compares the query with every stored word, O(n · L) per query instead of O(L).",
  guide: {
    title: "Implement Trie (Prefix Tree)",
    idea: [
      "Each node is a map from a letter to a child node, plus a flag for “a word ends here”. The root is empty. A path from the root spells a prefix.",
      "insert walks the word letter by letter, creating children that don't exist, and marks the last node. search walks the same way and needs every letter and the end mark. startsWith only needs every letter. All three are O(length of the word), however many words are stored.",
    ],
    whenToUse: ["Many words and questions about prefixes: autocomplete, spell checking, “does any word start with …”.", "Searching many words at once (Word Search II): one walk down the trie checks them all."],
    stages: [
      { id: "start", title: "An empty root", detail: "", pseudo: "self.root = TrieNode()  # children = {}, end = False" },
      { id: "walk", title: "Follow the child for the next letter", detail: "", pseudo: "cur = cur.children[c]" },
      { id: "add", title: "insert: missing child → create it", detail: "", pseudo: "if c not in cur.children: cur.children[c] = TrieNode()" },
      { id: "mark", title: "insert: mark the last node", detail: "", pseudo: "cur.end = True" },
      { id: "answer", title: "search / startsWith: answer", detail: "search needs the end mark; startsWith doesn't.", pseudo: "return cur.end  # or True for startsWith" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current node" },
      { tone: "pointer", label: "Path walked so far" },
      { tone: "found", label: "Node just created" },
      { tone: "swap", label: "No child for the next letter" },
    ],
    complexity: { time: "O(L) per call", space: "O(total letters)", why: "Each call visits one node per letter of its word; nodes are shared by words with the same prefix." },
    pitfalls: ["search must check the end mark: after inserting “apple”, “app” is a prefix but not a word.", "A dict of children is simplest; an array of 26 is a little faster but uses more memory."],
    tryThis: ["In LeetCode's example, search app is false until insert app marks the “p” node.", "In “car, cat, cart”, cart reuses the whole car path and adds one node."],
    python: py,
  },
};
