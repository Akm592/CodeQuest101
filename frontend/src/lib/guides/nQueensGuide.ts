import type { NQueensStep } from "../algorithms/nQueensSteps";
import nQueensPy from "./python/n_queens.py?raw";
import type { AlgorithmGuide } from "./types";

export const nQueensGuide: AlgorithmGuide = {
  title: "N-Queens (Backtracking)",
  idea: [
    "Place N queens on an N×N board so that no two share a row, column or diagonal. There are far too many arrangements to try them all, but most can be ruled out early: once two queens attack each other, nothing placed afterwards can fix it.",
    "Backtracking builds the answer one row at a time. In each row, try the columns left to right and skip any square a placed queen attacks. On a safe square, place a queen and move to the next row. If a row has no safe square left, the choice before it was wrong. Lift the previous queen and try its next column.",
    "That try → recurse → undo loop is a depth-first search over partial boards. The recursion stack is the list of queens placed so far, and every undo is a pop.",
  ],
  whenToUse: [
    "“Generate all” or “find any” arrangements that satisfy constraints: permutations, subsets, combinations, Sudoku, word search, and partitioning a string into palindromes.",
    "When a partial answer can be shown invalid early. That pruning is what makes backtracking far faster than brute force.",
    "When the answer is a sequence of choices you can make one at a time and also take back.",
  ],
  stages: [
    {
      id: "try",
      title: "Try the next column in this row",
      detail: "Pick the next untried square in the current row. The faint wash on the board marks squares already attacked by the queens placed so far.",
      pseudo: "for col in range(n):",
    },
    {
      id: "conflict",
      title: "Attacked → reject the square",
      detail: "A placed queen shares this square's column or a diagonal. The red line points to it. Rejecting now saves exploring every board that builds on this square.",
      pseudo: "if col in cols or row-col in diag or row+col in anti: continue",
    },
    {
      id: "place",
      title: "Safe → place a queen and recurse",
      detail: "Commit the queen, record its column and diagonals, and move to the next row. The recursion stack grows by one.",
      pseudo: "queens.append(col); place(row + 1)",
    },
    {
      id: "undo",
      title: "Dead end → undo and try the next column",
      detail: "Every square in the next row was attacked, so this queen can't be part of a solution here. Remove it, restoring exactly the state from before, and carry on with the next column.",
      pseudo: "queens.pop()  # backtrack",
    },
    {
      id: "solved",
      title: "Every row has a queen → solution",
      detail: "Reaching row N means N non-attacking queens are on the board. Record it, and either stop or keep backtracking to find the rest.",
      pseudo: "if row == n: solutions.append(queens.copy())",
    },
  ],
  legend: [
    { tone: "found", label: "Placed queen" },
    { tone: "current", label: "Square being tried" },
    { tone: "swap", label: "Rejected square, or a queen being lifted" },
    { tone: "visited", label: "Squares the placed queens attack" },
  ],
  complexity: {
    time: "O(N!)",
    space: "O(N)",
    why: "Each row has at most one queen, so there are at most N choices, then N − 1, and so on. Pruning cuts far deeper in practice: finding all 92 solutions to 8 queens takes 2,056 placements, against 8! = 40,320 arrangements, and the first solution takes only 113. Space is the recursion depth plus the column and diagonal sets.",
  },
  pitfalls: [
    "Checking attacks by scanning the whole board on every move. Keep three sets instead: columns, row − col diagonals, and row + col anti-diagonals. That makes each check O(1).",
    "Forgetting to undo every piece of state on the way back. Pop the queen and remove its column and both diagonals, or later branches see ghosts.",
    "Appending the shared `queens` list to the results instead of a copy. Every saved solution ends up as the same (empty) list.",
    "Mixing up the two diagonals. Squares on one diagonal share row − col, and on the other they share row + col.",
  ],
  tryThis: [
    "Set the board to 4 and step backwards through an undo. Walking backtracking in reverse is the clearest way to see it.",
    "Try sizes 2 and 3. They have no solution, and the search proves it by exhausting every option.",
    "Switch to “Find every solution” on 6 × 6 and count. There are 4 distinct boards.",
  ],
  python: nQueensPy,
};

export function nQueensGuideStepFor(step: NQueensStep): string {
  switch (step.action) {
    case "try":
      return "try";
    case "conflict":
      return "conflict";
    case "place":
      return "place";
    case "undo":
      return "undo";
    default:
      // "solution", and the closing "exhausted" step that reports the result.
      return "solved";
  }
}
