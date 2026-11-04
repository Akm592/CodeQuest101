import type { DpStep, DpTableLabels } from "../algorithms/dpSteps";
import editDistancePy from "./python/edit_distance.py?raw";
import knapsackPy from "./python/knapsack.py?raw";
import lcsPy from "./python/lcs.py?raw";
import type { AlgorithmGuide, LegendEntry } from "./types";

const DP_LEGEND: LegendEntry[] = [
  { tone: "current", label: "Cell being computed" },
  { tone: "compare", label: "Cells it reads (dashed arrows)" },
  { tone: "visited", label: "Already computed" },
  { tone: "found", label: "Traceback path to the answer" },
];

// ---------------------------------------------------------------------------
// Edit distance
// ---------------------------------------------------------------------------

export const editDistanceGuide: AlgorithmGuide = {
  title: "Edit Distance",
  idea: [
    "Edit distance is the fewest single-character inserts, deletes and replaces that turn one string into another. Trying every sequence of edits is exponential, but the problem has a small set of subproblems that keep repeating: how far apart are the first i letters of one string and the first j letters of the other?",
    "Put those answers in a table, cell (i, j) for each pair of prefixes. A cell only depends on three neighbours, so filling it row by row means each one is computed exactly once. The bottom-right cell is the answer for the whole strings.",
    "Each neighbour is one edit. Up-left is replace (or a free match), up is delete, and left is insert. That's why the arrow drawn to the winning neighbour is the edit itself.",
  ],
  whenToUse: [
    "“Minimum number of operations to convert A into B.”",
    "Spell checkers, DNA alignment, diff tools, and fuzzy search.",
    "Any two-string problem where the answer for whole strings builds from answers for shorter prefixes.",
  ],
  stages: [
    {
      id: "base",
      title: "Fill the base row and column",
      detail: "Turning a prefix into the empty string takes one delete per letter, and building a prefix from nothing takes one insert per letter. These are the cells every other cell eventually leans on.",
      pseudo: "dp[i][0] = i;  dp[0][j] = j",
    },
    {
      id: "match",
      title: "Letters match → copy the diagonal",
      detail: "If the two current letters are equal, they cost nothing. The answer is whatever it took to align everything before them.",
      pseudo: "if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1]",
    },
    {
      id: "mismatch",
      title: "Letters differ → 1 + cheapest neighbour",
      detail: "Pay for one edit and take the cheapest way in: replace (diagonal), delete from the first string (above), or insert into it (left). The solid arrow shows which one won.",
      pseudo: "else: dp[i][j] = 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])",
    },
    {
      id: "trace",
      title: "Trace the cheapest path back",
      detail: "Walk from the bottom-right corner back to the start, at each cell stepping to the neighbour it came from. The steps spell out the actual edits, not just how many.",
      pseudo: "while (i, j) != (0, 0): step to the cell dp[i][j] came from",
    },
    {
      id: "answer",
      title: "The corner cell is the answer",
      detail: "dp[m][n] is the edit distance between the full strings.",
      pseudo: "return dp[m][n]",
    },
  ],
  legend: DP_LEGEND,
  complexity: {
    time: "O(m × n)",
    space: "O(m × n)",
    why: "There's one cell per pair of prefixes, and each cell reads three neighbours, which is O(1) work. If you only need the number, keep two rows and space drops to O(min(m, n)), but then you can't trace the edits back.",
  },
  pitfalls: [
    "Off-by-one indexing: dp has m + 1 rows and n + 1 columns, and cell (i, j) compares a[i-1] with b[j-1]. The extra row and column are the empty prefixes.",
    "Forgetting the base row and column, or filling them with zeros. Distance from “abc” to “” is 3, not 0.",
    "Adding 1 on a match. Equal letters cost nothing, so copy the diagonal unchanged.",
    "Filling cells in an order where a neighbour isn't ready yet. Row by row, left to right, always works.",
  ],
  tryThis: [
    "Type the same word in both boxes. Every cell on the diagonal is a match, and the distance is 0.",
    "Try “flaw” → “lawn”. Watch the traceback find a delete at the start and an insert at the end, not four replaces.",
    "Make one string empty, then add a letter back. The answer is just the base row or column.",
  ],
  python: editDistancePy,
};

// ---------------------------------------------------------------------------
// Longest common subsequence
// ---------------------------------------------------------------------------

export const lcsGuide: AlgorithmGuide = {
  title: "Longest Common Subsequence",
  idea: [
    "A subsequence keeps letters in order but may skip some, so “ace” is a subsequence of “abcde”. The LCS is the longest one two strings share.",
    "Like edit distance, the answer for whole strings builds from answers for prefixes. If the last letters match, they belong to an LCS, so take the diagonal and add one. If they don't, at least one of them is not in it. Drop either letter and keep the better result.",
    "The table only stores lengths. Tracing back from the corner and collecting the letters where a match was taken recovers the subsequence itself.",
  ],
  whenToUse: [
    "“Longest common subsequence”, “minimum deletions to make two strings equal”, “shortest common supersequence”.",
    "Diff tools (what stayed the same between two files) and version control merges.",
    "It's the same table shape as edit distance with a different rule per cell. Recognising that family is half the battle.",
  ],
  stages: [
    {
      id: "base",
      title: "Row 0 and column 0 are zero",
      detail: "An empty string shares nothing with anything, so every cell touching the empty prefix is 0.",
      pseudo: "dp[0][*] = dp[*][0] = 0",
    },
    {
      id: "match",
      title: "Letters match → diagonal + 1",
      detail: "Both letters can end the common subsequence together, so extend the best one for the shorter prefixes by one.",
      pseudo: "if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1] + 1",
    },
    {
      id: "mismatch",
      title: "Letters differ → better of up and left",
      detail: "They can't both be the last letter of the LCS. Skip one letter of either string, and keep whichever choice did better.",
      pseudo: "else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
    },
    {
      id: "trace",
      title: "Trace back and collect matches",
      detail: "From the corner, a diagonal step on a match means that letter is in the LCS. Otherwise step toward the larger neighbour.",
      pseudo: "match → keep a[i-1], i--, j--;  else move to the larger of up/left",
    },
    {
      id: "answer",
      title: "Read off the subsequence",
      detail: "The corner holds the length, and the collected letters, reversed, are the subsequence.",
      pseudo: "return reversed(collected)",
    },
  ],
  legend: DP_LEGEND,
  complexity: {
    time: "O(m × n)",
    space: "O(m × n)",
    why: "There's one O(1) cell per pair of prefixes. The length alone fits in two rows, but recovering the letters needs the full table, or Hirschberg's divide-and-conquer trick.",
  },
  pitfalls: [
    "Confusing subsequence with substring. A substring must be contiguous and needs a different recurrence that resets to 0 on a mismatch.",
    "On a mismatch, taking the diagonal instead of max(up, left). That skips a letter from both strings at once and can miss the answer.",
    "Expecting one unique answer. Ties in the traceback give different but equally long subsequences, and all are correct.",
  ],
  tryThis: [
    "“abcde” vs “ace”: every letter of the shorter string matches, so the LCS is “ace”.",
    "Two strings with no letters in common. The whole table stays 0.",
    "Swap the two strings. The length is the same, but the table is transposed.",
  ],
  python: lcsPy,
};

// ---------------------------------------------------------------------------
// 0/1 knapsack
// ---------------------------------------------------------------------------

export const knapsackGuide: AlgorithmGuide = {
  title: "0/1 Knapsack",
  idea: [
    "Each item has a weight and a value, the bag has a capacity, and every item is either taken whole or left behind. Greedy fails: the most valuable item per kilo can crowd out a better combination.",
    "Row i answers “using only the first i items”, and column c answers “with capacity c”. For each cell, item i is either skipped, so the answer is the one above, or taken, so its value is added to the best answer for the room left: the row above, c − weight columns to the left.",
    "That jump to the left by the item's weight is the part people trip on, and the dashed arrow shows it.",
  ],
  whenToUse: [
    "“Choose a subset under a budget to maximise or minimise something.”",
    "Subset sum, partition into equal halves, target sum with plus and minus signs, and coin change variants.",
    "When each item can be used once, it's 0/1. If items can repeat, it's the unbounded version, which reads its own row instead of the row above.",
  ],
  stages: [
    {
      id: "base",
      title: "No items → value 0",
      detail: "With nothing to choose from, every capacity is worth 0. That's row 0.",
      pseudo: "dp[0][c] = 0",
    },
    {
      id: "tooHeavy",
      title: "Too heavy → carry the value down",
      detail: "The item doesn't fit in capacity c at all, so the best you can do is what you had without it.",
      pseudo: "if weight > c: dp[i][c] = dp[i-1][c]",
    },
    {
      id: "take",
      title: "Taking it wins → take it",
      detail: "Its value plus the best answer for the remaining capacity (c − weight, previous row) beats leaving it out.",
      pseudo: "dp[i][c] = dp[i-1][c-weight] + value",
    },
    {
      id: "skip",
      title: "Leaving it out wins → skip it",
      detail: "It fits, but taking it would be no better than the best without it, so keep the value from the row above.",
      pseudo: "dp[i][c] = dp[i-1][c]",
    },
    {
      id: "trace",
      title: "Trace back the items taken",
      detail: "From the bottom-right corner, if a cell differs from the one above it, that item was taken. Move up and left by its weight. Otherwise just move up.",
      pseudo: "if dp[i][c] != dp[i-1][c]: take item i; c -= weight",
    },
    {
      id: "answer",
      title: "Best value is in the corner",
      detail: "dp[n][capacity] is the best value, and the traceback lists the items that make it.",
      pseudo: "return dp[n][capacity]",
    },
  ],
  legend: DP_LEGEND,
  complexity: {
    time: "O(n × capacity)",
    space: "O(n × capacity)",
    why: "There's one O(1) cell per item and capacity. This is pseudo-polynomial: it grows with the capacity's numeric value, not its digit count. A one-row version needs only O(capacity) space, if you loop capacities from high to low.",
  },
  pitfalls: [
    "In the one-row version, looping capacity from low to high. That lets an item be used twice, which turns 0/1 into unbounded knapsack. Go high to low.",
    "Reading the take value from the current row instead of the row above. Same bug, same result: items get reused.",
    "Sorting by value per weight and going greedy. That works for fractional knapsack, not this one.",
    "Forgetting the “doesn't fit” case and indexing a negative column.",
  ],
  tryThis: [
    "Set capacity to 3. Only D fits, so the answer is 50.",
    "Set capacity to 7. B + D (40 + 50 = 90) beats any single item.",
    "Watch row C. It's often skipped even when it fits, because B + D already does better.",
  ],
  python: knapsackPy,
};

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

/**
 * The stage a DP step belongs to. Needs the table labels because "match" and
 * "mismatch" are decided by the two letters a cell compares.
 */
export function dpGuideStepFor(
  problem: "editDistance" | "lcs" | "knapsack",
  step: DpStep,
  labels: DpTableLabels,
): string {
  switch (step.phase) {
    case "init":
      return "base";
    case "traceback":
      return "trace";
    case "done":
      return "answer";
  }

  if (problem === "knapsack") {
    // One source means the item could not fit; with two, `chosen` says which won.
    if (step.from.length === 1) return "tooHeavy";
    const take = step.from[1];
    return step.chosen?.row === take.row && step.chosen?.col === take.col ? "take" : "skip";
  }

  return labels.rowHeader[step.row] === labels.colHeader[step.col] ? "match" : "mismatch";
}

export const DP_GUIDES = {
  editDistance: editDistanceGuide,
  lcs: lcsGuide,
  knapsack: knapsackGuide,
} as const;
