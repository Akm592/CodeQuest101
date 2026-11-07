// Arrays & Hashing: the first category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { containsDuplicate } from "./containsDuplicate";
import { encodeDecode } from "./encodeDecode";
import { groupAnagrams } from "./groupAnagrams";
import { longestConsecutive } from "./longestConsecutive";
import { productExceptSelf } from "./productExceptSelf";
import { topKFrequent } from "./topKFrequent";
import { twoSum } from "./twoSum";
import { validAnagram } from "./validAnagram";
import { validSudoku } from "./validSudoku";

export const ARRAYS_HASHING: AnyProblem[] = [
  containsDuplicate,
  validAnagram,
  twoSum,
  groupAnagrams,
  topKFrequent,
  productExceptSelf,
  validSudoku,
  encodeDecode,
  longestConsecutive,
];
