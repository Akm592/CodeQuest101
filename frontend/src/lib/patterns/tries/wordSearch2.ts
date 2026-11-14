// Word Search II (NeetCode 150 · Tries).

import py from "../../guides/python/neetcode/word_search_ii.py?raw";
import { rngFor, show } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";
import { type Trie, insertWord, newTrie, rootLabel, trieLayout } from "./trie";

/** The board as rows of letters, and the words to look for. */
type Input = { board: string[]; words: string[] };

const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const;

function run({ board, words }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const R = board.length;
  const C = board[0].length;
  const root = newTrie();
  for (const w of words) insertWord(root, w);
  const gone = new Set<string>(); // pruned and hidden
  let fresh: Trie[] = []; // pruned this moment, shown in red once
  const found: string[] = [];
  let path: [number, number][] = [];
  let hitCells: [number, number][] = [];
  let ops = 0;
  const live = (t: Trie, ch: string) => {
    const k = t.kids.get(ch);
    return k && !gone.has(k.id) && !fresh.includes(k) ? k : undefined;
  };
  const empty = (t: Trie) => !t.end && [...t.kids.values()].every((k) => gone.has(k.id) || fresh.includes(k));
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const on = new Map(path.map(([r, c], i) => [`${r},${c}`, i]));
    const hit = new Set(hitCells.map(([r, c]) => `${r},${c}`));
    const cells: PCell[][] = board.map((line, r) =>
      [...line].map((v, c): PCell => {
        const i = on.get(`${r},${c}`);
        return { v, tone: hit.has(`${r},${c}`) ? "found" : i === undefined ? undefined : i === path.length - 1 ? "current" : "pointer" };
      }),
    );
    const prefix = path.map(([r, c]) => board[r][c]).join("");
    const trail = new Set(prefix ? [...prefix].map((_, i) => "^" + prefix.slice(0, i + 1)) : []);
    trail.add(root.id);
    const freshIds = new Set(fresh.map((t) => t.id));
    const nodes = trieLayout(root, {
      hide: (t) => gone.has(t.id),
      tone: (t) => (freshIds.has(t.id) ? "swap" : t.id === "^" + prefix && prefix ? (hitCells.length ? "found" : "current") : trail.has(t.id) && prefix ? (hitCells.length ? "found" : "pointer") : undefined),
      edgeTone: (t) => (trail.has(t.id) && t !== root && prefix ? (hitCells.length ? "found" : "pointer") : undefined),
    });
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: { title: prefix ? `board: path “${prefix}”` : "board", cells },
      tree: { title: "all the words in one trie (double ring = a word still to find)", nodes, labels: rootLabel(nodes) },
      vars: [
        { name: "found", value: found.length ? show(found) : "–", tone: "found" },
        { name: "trie nodes left", value: String(nodes.length) },
      ],
      ops,
      ...extra,
    });
  };
  const flush = () => {
    if (!fresh.length) return;
    const top = fresh.reduce((a, b) => (a.id.length < b.id.length ? a : b));
    snap("prune", `No word left in the trie starts with “${top.id.slice(1)}”, so remove ${fresh.length === 1 ? "that node" : `those ${fresh.length} nodes`}. Later searches won't walk into a branch that can't find anything.`);
    for (const t of fresh) gone.add(t.id);
    fresh = [];
  };
  snap("start", `Put all ${words.length} words into one trie. Then search the board once: from each cell, walk the board and the trie together. A step to a neighbour is only worth taking if its letter is a child of the current trie node, so every word sharing a prefix is checked at the same time.`);
  let skipped = 0;
  const dfs = (r: number, c: number, t: Trie) => {
    path.push([r, c]);
    const prefix = path.map(([y, x]) => board[y][x]).join("");
    ops++;
    if (path.length === 1) {
      snap("begin", `${skipped ? `Skip ${skipped} cell${skipped === 1 ? "" : "s"} whose letter starts no remaining word. ` : ""}Start at row ${r}, column ${c}: “${board[r][c]}” is a child of the root.`);
      skipped = 0;
    } else snap("extend", `The neighbour “${board[r][c]}” is a child of “${prefix.slice(0, -1)}” in the trie: the path spells “${prefix}”.`);
    const justFound = t.end;
    if (t.end) {
      t.end = false;
      found.push(prefix);
      hitCells = [...path];
      snap("found", `“${prefix}” ends at a word mark: found it! Clear the mark so it isn't added twice.`);
      hitCells = [];
    }
    let went = false;
    for (const [dr, dc] of DIRS) {
      const y = r + dr;
      const x = c + dc;
      if (y < 0 || x < 0 || y >= R || x >= C) continue;
      ops++;
      if (path.some(([py, px]) => py === y && px === x)) continue;
      const nx = live(t, board[y][x]);
      if (!nx) continue;
      went = true;
      dfs(y, x, nx);
      if (fresh.length && !empty(t)) flush();
    }
    if (!went && !(justFound && empty(t)))
      snap("back", `${justFound ? `Longer words start with “${prefix}”, but n` : "N"}o unused neighbour of this “${board[r][c]}” continues “${prefix}” in the trie. Step back.`);
    path.pop();
    if (empty(t)) fresh.push(t);
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      const t = live(root, board[r][c]);
      if (!t) {
        skipped++;
        continue;
      }
      dfs(r, c, t);
      flush();
    }
  path = [];
  const answer = show([...found].sort());
  snap("done", `Every cell has been a starting point. Found ${found.length} of the ${words.length} words: ${answer}.`, { done: true, answer });
  return steps;
}

/** The slow way: run a separate Word Search for every word. */
function slow({ board, words }: Input) {
  const R = board.length;
  const C = board[0].length;
  let ops = 0;
  const seen = Array.from({ length: R }, () => Array<boolean>(C).fill(false));
  const has = (w: string, i: number, r: number, c: number): boolean => {
    ops++;
    if (r < 0 || c < 0 || r >= R || c >= C || seen[r][c] || board[r][c] !== w[i]) return false;
    if (i === w.length - 1) return true;
    seen[r][c] = true;
    const ok = DIRS.some(([dr, dc]) => has(w, i + 1, r + dr, c + dc));
    seen[r][c] = false;
    return ok;
  };
  const out = [...new Set(words)].filter((w) => {
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (has(w, 0, r, c)) return true;
    return false;
  });
  return { answer: show(out.sort()), ops };
}

/** A word made by a random walk on the board, so it can be found. */
function walkWord(g: ReturnType<typeof rngFor>, board: string[], len: number): string {
  const R = board.length;
  const C = board[0].length;
  let r = g.int(0, R - 1);
  let c = g.int(0, C - 1);
  const used = new Set([`${r},${c}`]);
  let w = board[r][c];
  while (w.length < len) {
    const next = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([y, x]) => y >= 0 && x >= 0 && y < R && x < C && !used.has(`${y},${x}`));
    if (!next.length) break;
    [r, c] = g.pick(next);
    used.add(`${r},${c}`);
    w += board[r][c];
  }
  return w;
}

function randomCase(seed: number, R: number, C: number, letters: string, real: number, fake: number, lo: number, hi: number): Input {
  const g = rngFor(seed);
  const board = Array.from({ length: R }, () => Array.from({ length: C }, () => g.pick([...letters])).join(""));
  const words = new Set<string>();
  for (let i = 0; i < real; i++) words.add(walkWord(g, board, g.int(lo, hi)));
  for (let i = 0; i < fake; i++) words.add(Array.from({ length: g.int(lo, hi) }, () => g.pick([...letters])).join(""));
  return { board, words: [...words] };
}

export const wordSearch2: PatternProblem<Input> = {
  id: "word-search-ii",
  title: "Word Search II",
  difficulty: "Hard",
  blind75: true,
  slug: "word-search-ii",
  video: "asbcE9mZz_U",
  statement: "Given a board of letters and a list of words, return every word that can be spelled by a path of side-by-side cells (up, down, left, right), using each cell at most once per word.",
  examples: [
    { label: "LeetCode's example", input: { board: ["oaan", "etae", "ihkr", "iflv"], words: ["oath", "pea", "eat", "rain"] } },
    { label: "shared prefixes", input: { board: ["cat", "art", "tsp"], words: ["cat", "cats", "car", "cart", "cop"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomCase(seed, g.int(2, 3), g.int(3, 4), "abcd", 2, 2, 2, 4);
  },
  big: { label: "4×4 board of a’s, 10 words like aaaaab (none there)", input: () => ({ board: Array(4).fill("aaaa"), words: [..."bcdefghijk"].map((c) => "aaaaa" + c) }) },
  describe: ({ board, words }) => `board = [${board.join(", ")}], words = ${show(words)}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Run Word Search once per word: a DFS from every cell for every word. Words that share a prefix redo the same walks again and again.",
  guide: {
    title: "Word Search II",
    idea: [
      "Searching for each word on its own repeats the same work: “cat”, “cats” and “car” all start by finding c → a. Put every word in one trie and do a single DFS from each cell, moving the board path and the trie node together.",
      "Step to a neighbour only if it's unused and its letter is a child of the current trie node. Reaching a word mark means a word is found; clear the mark so it isn't added twice. When a trie node has no children and no mark left, remove it: the search will never walk that branch again.",
    ],
    whenToUse: ["Many words searched in the same space (a board, a text): build one trie and search once.", "Backtracking where many targets share prefixes: the trie decides which branches are still worth trying."],
    stages: [
      { id: "start", title: "Put every word in one trie", detail: "", pseudo: "for w in words: root.add(w)" },
      { id: "begin", title: "Start a DFS from a cell whose letter starts a word", detail: "Other cells are skipped at once.", pseudo: "for r, c in cells: dfs(r, c, root)" },
      { id: "extend", title: "Step to a neighbour that's a trie child", detail: "", pseudo: "node = node.children[board[r][c]]; visit.add((r, c))" },
      { id: "found", title: "A word mark: record the word", detail: "", pseudo: "if node.word: res.add(word); node.word = False" },
      { id: "back", title: "No neighbour continues: step back", detail: "", pseudo: "visit.remove((r, c))" },
      { id: "prune", title: "Remove branches with nothing left to find", detail: "", pseudo: "if not node.children and not node.word: del parent.children[c]" },
      { id: "done", title: "Every cell tried", detail: "", pseudo: "return list(res)" },
    ],
    legend: [
      { tone: "current", label: "Current cell / trie node" },
      { tone: "pointer", label: "Path so far" },
      { tone: "found", label: "Word found" },
      { tone: "swap", label: "Trie nodes being removed" },
    ],
    complexity: { time: "O(T + R · C · 4 · 3^(L−1))", space: "O(T)", why: "T is the total dictionary letter count: building the trie takes O(T). From each board cell, a path can try four initial directions and at most three thereafter, up to length L. Trie pruning often cuts this work substantially. The Python solution uses O(T) trie space plus an O(L) recursion stack, where L ≤ T." },
    pitfalls: ["Mark cells as used on the way in and unmark them on the way out, or one path can reuse a cell.", "Don't stop at the first word found: a longer word (“cats” after “cat”) may continue from the same node."],
    tryThis: ["In “shared prefixes”, every word found starts from the top-left c: cat, car and cart go right first, cats goes down. cop is never found: no c touches an o, so the search never takes a step toward it.", "In LeetCode's example, watch the o → a → t → h branch disappear once “oath” is found."],
    python: py,
  },
};
