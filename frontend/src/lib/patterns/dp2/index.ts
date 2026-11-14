// 2-D Dynamic Programming: the fourteenth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { burstBalloons, coinChange2, longestIncreasingPath, stockCooldown, targetSum } from "./otherTables";
import { distinctSubsequences, editDistance, interleavingString, lcs, regexMatching } from "./stringTables";
import { uniquePaths } from "./uniquePaths";

export const DP2: AnyProblem[] = [
  uniquePaths,
  lcs,
  stockCooldown,
  coinChange2,
  targetSum,
  interleavingString,
  longestIncreasingPath,
  distinctSubsequences,
  editDistance,
  burstBalloons,
  regexMatching,
];
