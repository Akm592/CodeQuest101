// Binary Search: the fifth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { binarySearchProblem } from "./binarySearch";
import { findMinRotated } from "./findMinRotated";
import { kokoBananas } from "./kokoBananas";
import { medianTwoArrays } from "./medianTwoArrays";
import { search2dMatrix } from "./search2dMatrix";
import { searchRotated } from "./searchRotated";
import { timeMap } from "./timeMap";

export const BINARY_SEARCH: AnyProblem[] = [binarySearchProblem, search2dMatrix, kokoBananas, findMinRotated, searchRotated, timeMap, medianTwoArrays];
