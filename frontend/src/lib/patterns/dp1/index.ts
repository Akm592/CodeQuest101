// 1-D Dynamic Programming: the thirteenth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { climbingStairs } from "./climbingStairs";
import { coinChange } from "./coinChange";
import { decodeWays } from "./decodeWays";
import { houseRobber } from "./houseRobber";
import { houseRobber2 } from "./houseRobber2";
import { lis } from "./lis";
import { maxProduct } from "./maxProduct";
import { minCostStairs } from "./minCostStairs";
import { longestPalindrome, palindromicSubstrings } from "./palindromes";
import { partitionSubset } from "./partitionSubset";
import { wordBreak } from "./wordBreak";

export const DP1: AnyProblem[] = [
  climbingStairs,
  minCostStairs,
  houseRobber,
  houseRobber2,
  longestPalindrome,
  palindromicSubstrings,
  decodeWays,
  coinChange,
  maxProduct,
  wordBreak,
  lis,
  partitionSubset,
];
