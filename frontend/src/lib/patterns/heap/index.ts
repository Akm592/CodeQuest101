// Heap / Priority Queue: the ninth category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { designTwitter } from "./designTwitter";
import { findMedian } from "./findMedian";
import { kClosest } from "./kClosest";
import { kthLargestArray } from "./kthLargestArray";
import { kthLargestStream } from "./kthLargestStream";
import { lastStoneWeight } from "./lastStoneWeight";
import { taskScheduler } from "./taskScheduler";

export const HEAP: AnyProblem[] = [kthLargestStream, lastStoneWeight, kClosest, kthLargestArray, taskScheduler, designTwitter, findMedian];
