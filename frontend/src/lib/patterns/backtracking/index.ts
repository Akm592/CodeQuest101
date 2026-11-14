// Backtracking: the tenth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { combinationSum } from "./combinationSum";
import { combinationSum2 } from "./combinationSum2";
import { letterCombinations } from "./letterCombinations";
import { nQueens } from "./nQueens";
import { palindromePartition } from "./palindromePartition";
import { permutations } from "./permutations";
import { subsets } from "./subsets";
import { subsets2 } from "./subsets2";
import { wordSearch } from "./wordSearch";

export const BACKTRACKING: AnyProblem[] = [subsets, combinationSum, permutations, subsets2, combinationSum2, wordSearch, palindromePartition, letterCombinations, nQueens];
