// Sliding Window: the third category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { bestTimeStock } from "./bestTimeStock";
import { characterReplacement } from "./characterReplacement";
import { longestSubstring } from "./longestSubstring";
import { minimumWindow } from "./minimumWindow";
import { permutationInString } from "./permutationInString";
import { slidingWindowMax } from "./slidingWindowMax";

export const SLIDING_WINDOW: AnyProblem[] = [bestTimeStock, longestSubstring, characterReplacement, permutationInString, minimumWindow, slidingWindowMax];
